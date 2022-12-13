import { render } from "./renderer.js";

import { shell } from "./components/index.js";

window.addEventListener('load', () => render(shell()));
