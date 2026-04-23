import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (!config.headers) config.headers = {}
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}

    if (!original || original._retry) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      if (original.url === '/user/refresh') {
        localStorage.removeItem('accessToken')
        window.dispatchEvent(new Event('user:signout'))
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers = original.headers || {}
          original.headers['Authorization'] = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const response = await api.post('/user/refresh')
        const newToken = response.data?.data?.accessToken

        if (!newToken) throw new Error('No access token returned')
        localStorage.setItem('accessToken', newToken)
        api.defaults.headers['Authorization'] = `Bearer ${newToken}`
        processQueue(null, newToken)

        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('accessToken')

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