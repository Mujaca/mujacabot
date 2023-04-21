export interface LoNImage {
    id: string;
    tags: string[];
    hasChildren: boolean;
    file_url: string;
    source: string;
    rating: string;
}

export interface LoNData {
    channelID: string;
    neededVotes: number;
    votes: {
        userID: string;
        vote: string;
    }[];
    picture: LoNImage;
    messageID: string;
    deleted: boolean;
}