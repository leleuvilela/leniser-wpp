export interface ImgflipResponse<T> {
    success: boolean;
    data: T;
}

export interface SearchMemesData {
    memes: Meme[];
}

export interface AiMemeData {
    texts: string[];
    url: string;
    page_url: string;
}

export interface Meme {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    box_count: number;
    captions: number;
}
