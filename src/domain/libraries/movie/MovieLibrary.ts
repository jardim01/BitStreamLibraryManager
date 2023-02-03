import {Movie} from "./Movie";

export type MovieLibrary = {
    name: string,
    movies: { [movieId: number]: Movie }
}
