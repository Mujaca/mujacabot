import axios from "axios";

const httpInstance = axios.create({
    baseURL: 'https://api.wolvesville.com/',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.WOLVESVILLE_API_KEY
    }
})

export default httpInstance;