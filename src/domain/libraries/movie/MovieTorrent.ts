import {Resolution} from "../Resolution";

export type MovieTorrent = {
    label: string,
    resolution: Resolution,
    magnet: string,
    file_index: number
};
