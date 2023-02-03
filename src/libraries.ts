import {TvShowLibrary} from "./domain/libraries/tv/TvShowLibrary";
import {MovieLibrary} from "./domain/libraries/movie/MovieLibrary";
import {Validator} from "jsonschema";
// @ts-ignore
import tvLibrarySchema from "../resources/schemas/tv_library.json";
// @ts-ignore
import movieLibrarySchema from "../resources/schemas/movie_library.json";
import * as fs from "fs";

const validator = new Validator();

export function loadTvLibrary(path: string): TvShowLibrary {
    const text = fs.readFileSync(path, {encoding: "utf-8"});
    const json = JSON.parse(text);
    const res = validator.validate(json, tvLibrarySchema);
    if (!res.valid) throw Error("Invalid library format");
    return json;
}

export function loadMovieLibrary(path: string): MovieLibrary {
    const text = fs.readFileSync(path, {encoding: "utf-8"});
    const json = JSON.parse(text);
    const res = validator.validate(json, movieLibrarySchema);
    if (!res.valid) throw Error("Invalid library format");
    return json;
}
