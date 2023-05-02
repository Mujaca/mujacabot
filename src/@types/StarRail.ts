export interface apiResponse {
    retcode: number;
    message: string;
    data: {
        page: number;
        size: number;
        list: apiWish[];
        region: string;
        "region-time-zone": string;
    }
}

export interface apiWish {
    uid: number;
    gacha_id: number;
    gacha_type: number;
    item_id: number;
    count: number;
    time: string;
    name: string;
    lang: string;
    item_type: string;
    rank_type: string;
    id: number;
}

export interface wishData {
    userID: string;
    uid: number;
    gacha_id: number;
    gacha_type: number;
    item_id: number;
    count: number;
    time: string;
    name: string;
    lang: string;
    item_type: string;
    rank_type: string;
    id: number;
}