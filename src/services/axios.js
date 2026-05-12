import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
})

const refreshApi = axios.create({
  baseURL: '/',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config
    if (!error.response) {
      return Promise.reject(error)
    }
    if (originalRequest?._retry) {
      return Promise.reject(error)
    }
    if (error.response.status === 401) {

      // Refresh token invalid/expired
      if (originalRequest.url?.includes('/user/refresh')) {
        localStorage.removeItem('accessToken')

        delete api.defaults.headers.common.Authorization

        window.dispatchEvent(new Event('user:signout'))

        return Promise.reject(error)
      }

      // Queue requests while refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`

            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await refreshApi.post('/user/refresh')
        const newToken = response.data?.data?.accessToken
        if (!newToken) {
          throw new Error('No access token returned')
        }

        localStorage.setItem('accessToken', newToken)
        api.defaults.headers.common.Authorization =
          `Bearer ${newToken}`
        processQueue(null, newToken)
        originalRequest.headers.Authorization =
          `Bearer ${newToken}`

        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('accessToken')
        delete api.defaults.headers.common.Authorization
        window.dispatchEvent(new Event('user:signout'))
        return Promise.reject(err)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api