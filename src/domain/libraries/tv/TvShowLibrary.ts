import {TvShow} from "./TvShow";

export type TvShowLibrary = {
    name: string,
    shows: { [tvId: number]: TvShow }
}
