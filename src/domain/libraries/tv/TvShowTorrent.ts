import {Resolution} from "../Resolution";

export type TvShowTorrent = {
    label: string,
    resolution: Resolution,
    magnet: string,
    files: { [idx: number]: { season: number, episode: number } }
}
