import {Resolution} from "../Resolution";
import {TvShowTorrentFile} from "./TvShowTorrentFile";

export type TvShowTorrent = {
    label: string,
    resolution: Resolution,
    magnet: string,
    files: { [idx: number]: TvShowTorrentFile }
}
