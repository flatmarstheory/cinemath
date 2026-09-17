import { join } from "node:path";
import { loadContent } from "./content-loader";

// Server-only: every authored lesson under content/ is discovered and
// validated here. Adding a lesson means adding a JSON file — no import to
// register and no UI/grading changes, as long as it uses supported types.
const { course, lessons } = loadContent(join(process.cwd(), "content"));
export { course, lessons };
