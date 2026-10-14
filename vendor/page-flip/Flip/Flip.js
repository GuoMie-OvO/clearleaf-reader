import { Orientation } from "../Render/Render";
import { Helper } from "../Helper";
import { FlipCalculation } from "./FlipCalculation";
import { PageDensity } from "../Page/Page";
var FlipDirection = /* @__PURE__ */ ((FlipDirection2) => {
  FlipDirection2[FlipDirection2["FORWARD"] = 0] = "FORWARD";
  FlipDirection2[FlipDirection2["BACK"] = 1] = "BACK";
  return FlipDirection2;
})(FlipDirection || {});
var FlipCorner = /* @__PURE__ */ ((FlipCorner2) => {
  FlipCorner2["TOP"] = "top";
  FlipCorner2["BOTTOM"] = "bottom";
  return FlipCorner2;
})(FlipCorner || {});
var FlippingState = /* @__PURE__ */ ((FlippingState2) => {
  FlippingState2["USER_FOLD"] = "user_fold";
  FlippingState2["FOLD_CORNER"] = "fold_corner";
  FlippingState2["FLIPPING"] = "flipping";
  FlippingState2["READ"] = "read";
  return FlippingState2;
})(FlippingState || {});
class Flip {
  render;
  app;
  flippingPage = null;
  bottomPage = null;
  calc = null;
  state = "read" /* READ */;
  constructor(render, app) {
    this.render = render;
    this.app = app;
  }
  /**
   * Called when the page folding (User drags page corner)
   *
   * @param globalPos - Touch Point Coordinates (relative window)
   */
  fold(globalPos) {
    this.setState("user_fold" /* USER_FOLD */);
    if (this.calc === null) this.start(globalPos);
    this.do(this.render.convertToPage(globalPos));
  }
  /**
   * Page turning with animation
   *
   * @param globalPos - Touch Point Coordinates (relative window)
   */
  flip(globalPos) {
    if (this.app.getSettings().disableFlipByClick && !this.isPointOnCorners(globalPos)) return;
    if (this.calc !== null) this.render.finishAnimation();
    if (!this.start(globalPos)) return;
    const rect = this.getBoundsRect();
    this.setState("flipping" /* FLIPPING */);
    const topMargins = rect.height / 10;
    const yStart = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height - topMargins : topMargins;
    const yDest = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height : 0;
    this.calc.calc({ x: rect.pageWidth - topMargins, y: yStart });
    this.animateFlippingTo(
      { x: rect.pageWidth - topMargins, y: yStart },
      { x: -rect.pageWidth, y: yDest },
      true
    );
  }
  /**
   * Start the flipping process. Find direction and corner of flipping. Creating an object for calculation.
   *
   * @param {Point} globalPos - Touch Point Coordinates (relative window)
   *
   * @returns {boolean} True if flipping is possible, false otherwise
   */
  start(globalPos) {
    this.reset();
    const bookPos = this.render.convertToBook(globalPos);
    const rect = this.getBoundsRect();
    const direction = this.getDirectionByPoint(bookPos);
    const flipCorner = bookPos.y >= rect.height / 2 ? "bottom" /* BOTTOM */ : "top" /* TOP */;
    if (!this.checkDirection(direction)) return false;
    try {
      this.flippingPage = this.app.getPageCollection().getFlippingPage(direction);
      this.bottomPage = this.app.getPageCollection().getBottomPage(direction);
      if (this.render.getOrientation() === Orientation.LANDSCAPE) {
        if (direction === 1 /* BACK */) {
          const nextPage = this.app.getPageCollection().nextBy(this.flippingPage);
          if (nextPage !== null) {
            if (this.flippingPage.getDensity() !== nextPage.getDensity()) {
              this.flippingPage.setDrawingDensity(PageDensity.HARD);
              nextPage.setDrawingDensity(PageDensity.HARD);
            }
          }
        } else {
          const prevPage = this.app.getPageCollection().prevBy(this.flippingPage);
          if (prevPage !== null) {
            if (this.flippingPage.getDensity() !== prevPage.getDensity()) {
              this.flippingPage.setDrawingDensity(PageDensity.HARD);
              prevPage.setDrawingDensity(PageDensity.HARD);
            }
          }
        }
      }
      this.render.setDirection(direction);
      this.calc = new FlipCalculation(
        direction,
        flipCorner,
        rect.pageWidth.toString(10),
        // fix bug with type casting
        rect.height.toString(10)
        // fix bug with type casting
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * Perform calculations for the current page position. Pass data to render object
   *
   * @param {Point} pagePos - Touch Point Coordinates (relative active page)
   */
  do(pagePos) {
    if (this.calc === null) return;
    if (this.calc.calc(pagePos)) {
      const progress = this.calc.getFlippingProgress();
      this.bottomPage.setArea(this.calc.getBottomClipArea());
      this.bottomPage.setPosition(this.calc.getBottomPagePosition());
      this.bottomPage.setAngle(0);
      this.bottomPage.setHardAngle(0);
      this.flippingPage.setArea(this.calc.getFlippingClipArea());
      this.flippingPage.setPosition(this.calc.getActiveCorner());
      this.flippingPage.setAngle(this.calc.getAngle());
      if (this.calc.getDirection() === 0 /* FORWARD */) {
        this.flippingPage.setHardAngle(90 * (200 - progress * 2) / 100);
      } else {
        this.flippingPage.setHardAngle(-90 * (200 - progress * 2) / 100);
      }
      this.render.setPageRect(this.calc.getRect());
      this.render.setBottomPage(this.bottomPage);
      this.render.setFlippingPage(this.flippingPage);
      this.render.setShadowData(
        this.calc.getShadowStartPoint(),
        this.calc.getShadowAngle(),
        progress,
        this.calc.getDirection()
      );
    }
  }
  /**
   * Turn to the specified page number (with animation)
   *
   * @param {number} page - New page number
   * @param {FlipCorner} corner - Active page corner when turning
   */
  flipToPage(page, corner) {
    const current = this.app.getPageCollection().getCurrentSpreadIndex();
    const next = this.app.getPageCollection().getSpreadIndexByPage(page);
    try {
      if (next > current) {
        this.app.getPageCollection().setCurrentSpreadIndex(next - 1);
        this.flipNext(corner);
      }
      if (next < current) {
        this.app.getPageCollection().setCurrentSpreadIndex(next + 1);
        this.flipPrev(corner);
      }
    } catch (e) {
    }
  }
  /**
   * Turn to the next page (with animation)
   *
   * @param {FlipCorner} corner - Active page corner when turning
   */
  flipNext(corner) {
    this.flip({
      x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
      y: corner === "top" /* TOP */ ? 1 : this.render.getRect().height - 2
    });
  }
  /**
   * Turn to the prev page (with animation)
   *
   * @param {FlipCorner} corner - Active page corner when turning
   */
  flipPrev(corner) {
    this.flip({
      x: 10,
      y: corner === "top" /* TOP */ ? 1 : this.render.getRect().height - 2
    });
  }
  /**
   * Called when the user has stopped flipping
   */
  finishGesture(commit) {
    if (!this.calc) {
      this.setState("read" /* READ */);
      return;
    }
    const pos = this.calc.getPosition();
    const rect = this.getBoundsRect();
    const y = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height : 0;
    this.setState("flipping" /* FLIPPING */);
    this.animateFlippingTo(pos, { x: commit ? -rect.pageWidth : rect.pageWidth, y }, commit);
  }
  stopMove() {
    if (this.calc === null) return;
    const pos = this.calc.getPosition();
    const rect = this.getBoundsRect();
    const y = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height : 0;
    if (pos.x <= 0) this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
    else this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
  }
  /**
   * Fold the corners of the book when the mouse pointer is over them.
   * Called when the mouse pointer is over the book without clicking
   *
   * @param globalPos
   */
  showCorner(globalPos) {
    if (!this.checkState("read" /* READ */, "fold_corner" /* FOLD_CORNER */)) return;
    const rect = this.getBoundsRect();
    const pageWidth = rect.pageWidth;
    if (this.isPointOnCorners(globalPos)) {
      if (this.calc === null) {
        if (!this.start(globalPos)) return;
        this.setState("fold_corner" /* FOLD_CORNER */);
        this.calc.calc({ x: pageWidth - 1, y: 1 });
        const fixedCornerSize = 50;
        const yStart = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height - 1 : 1;
        const yDest = this.calc.getCorner() === "bottom" /* BOTTOM */ ? rect.height - fixedCornerSize : fixedCornerSize;
        this.animateFlippingTo(
          { x: pageWidth - 1, y: yStart },
          { x: pageWidth - fixedCornerSize, y: yDest },
          false,
          false
        );
      } else {
        this.do(this.render.convertToPage(globalPos));
      }
    } else {
      this.setState("read" /* READ */);
      this.render.finishAnimation();
      this.stopMove();
    }
  }
  /**
   * Starting the flipping animation process
   *
   * @param {Point} start - animation start point
   * @param {Point} dest - animation end point
   * @param {boolean} isTurned - will the page turn over, or just bring it back
   * @param {boolean} needReset - reset the flipping process at the end of the animation
   */
  animateFlippingTo(start, dest, isTurned, needReset = true) {
    const points = Helper.GetCordsFromTwoPoint(start, dest);
    const frames = [];
    for (const p of points) frames.push(() => this.do(p));
    const duration = this.getAnimationDuration(points.length);
    this.render.startAnimation(frames, duration, () => {
      if (!this.calc) return;
      if (isTurned) {
        if (this.calc.getDirection() === 1 /* BACK */) this.app.turnToPrevPage();
        else this.app.turnToNextPage();
      }
      if (needReset) {
        this.render.setBottomPage(null);
        this.render.setFlippingPage(null);
        this.render.clearShadow();
        this.setState("read" /* READ */);
        this.reset();
      }
    });
  }
  /**
   * Get the current calculations object
   */
  getCalculation() {
    return this.calc;
  }
  /**
   * Get current flipping state
   */
  getState() {
    return this.state;
  }
  setState(newState) {
    if (this.state !== newState) {
      this.app.updateState(newState);
      this.state = newState;
    }
  }
  getDirectionByPoint(touchPos) {
    const rect = this.getBoundsRect();
    if (this.render.getOrientation() === Orientation.PORTRAIT) {
      if (touchPos.x - rect.pageWidth <= rect.width / 5) {
        return 1 /* BACK */;
      }
    } else if (touchPos.x < rect.width / 2) {
      return 1 /* BACK */;
    }
    return 0 /* FORWARD */;
  }
  getAnimationDuration(size) {
    const defaultTime = this.app.getSettings().flippingTime;
    if (size >= 1e3) return defaultTime;
    return size / 1e3 * defaultTime;
  }
  checkDirection(direction) {
    if (direction === 0 /* FORWARD */)
      return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;
    return this.app.getCurrentPageIndex() >= 1;
  }
  reset() {
    this.calc = null;
    this.flippingPage = null;
    this.bottomPage = null;
  }
  getBoundsRect() {
    return this.render.getRect();
  }
  checkState(...states) {
    for (const state of states) {
      if (this.state === state) return true;
    }
    return false;
  }
  isPointOnCorners(globalPos) {
    const rect = this.getBoundsRect();
    const pageWidth = rect.pageWidth;
    const operatingDistance = Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;
    const bookPos = this.render.convertToBook(globalPos);
    return bookPos.x > 0 && bookPos.y > 0 && bookPos.x < rect.width && bookPos.y < rect.height && (bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) && (bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance);
  }
}
export {
  Flip,
  FlipCorner,
  FlipDirection,
  FlippingState
};
