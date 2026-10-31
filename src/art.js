/* Scene router. */
import { drawStreet } from "./street.js";
import { drawBathroom } from "./bathroom.js";
import { drawBattle } from "./battle.js";
import { drawPortrait } from "./portraits.js";

export { drawPortrait };

export function drawScene(ctx, W, H, t, state) {
  switch (state.scene) {
    case "bathroom":
      drawBathroom(ctx, W, H, t, state);
      break;
    case "battle":
      drawBattle(ctx, W, H, t, state);
      break;
    case "title":
    case "ending":
      drawStreet(ctx, W, H, t, { ...state, title: state.scene === "title", ending: state.scene === "ending" });
      break;
    case "street":
    default:
      drawStreet(ctx, W, H, t, state);
      break;
  }
}
