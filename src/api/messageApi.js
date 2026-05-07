import api from "../services/axios";

export const messageApi = {

    // SEND MESSAGE
    sendMessage:
        (
            conversationId,
            payload
        ) =>

            api.post(
                `/messages/${conversationId}`,
                payload
            ),

    // GET MESSAGES
    getMessages:
        (
            conversationId,
            params = {}
        ) =>

            api.get(
                `/messages/${conversationId}`,
                {
                    params
                }
            ),

    // DELETE MESSAGE
    deleteMessage:
        (messageId) =>

            api.delete(
                `/messages/${messageId}`
            ),
};