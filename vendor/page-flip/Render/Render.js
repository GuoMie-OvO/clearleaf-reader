import { FlipDirection } from "../Flip/Flip";
import { PageOrientation } from "../Page/Page";
import { SizeType } from "../Settings";
var Orientation = /* @__PURE__ */ ((Orientation2) => {
  Orientation2["PORTRAIT"] = "portrait";
  Orientation2["LANDSCAPE"] = "landscape";
  return Orientation2;
})(Orientation || {});
class Render {
  setting;
  app;
  /** Left static book page */
  leftPage = null;
  /** Right static book page */
  rightPage = null;
  /** Page currently flipping */
  flippingPage = null;
  /** Next page at the time of flipping */
  bottomPage = null;
  /** Current flipping direction */
  direction = null;
  /** Current book orientation */
  orientation = null;
  /** Сurrent state of the shadows */
  shadow = null;
  /** Сurrent animation process */
  animation = null;
  /** Page borders while flipping */
  pageRect = null;
  /** Current book area */
  boundsRect = null;
  /** Timer started from start of rendering */
  timer = 0;
  /**
   * Safari browser definitions for resolving a bug with a css property clip-area
   *
   * https://bugs.webkit.org/show_bug.cgi?id=126207
   */
  safari = false;
  constructor(app, setting) {
    this.setting = setting;
    this.app = app;
    const regex = new RegExp("Version\\/[\\d\\.]+.*Safari/");
    this.safari = regex.exec(window.navigator.userAgent) !== null;
  }
  /**
   * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
   *
   * @param timer
   */
  render(timer) {
    if (this.animation !== null) {
      const frameIndex = Math.round(
        (timer - this.animation.startedAt) / this.animation.durationFrame
      );
      if (frameIndex < this.animation.frames.length) {
        this.animation.frames[frameIndex]();
      } else {
        this.animation.onAnimateEnd();
        this.animation = null;
      }
    }
    this.timer = timer;
    this.drawFrame();
  }
  /**
   * Running requestAnimationFrame, and rendering process
   */
  frameId = 0;
  stopped = false;
  start() {
    this.stopped = false;
    this.update();
    const loop = (timer) => {
      if (this.stopped) return;
      this.render(timer);
      this.frameId = requestAnimationFrame(loop);
    };
    this.frameId = requestAnimationFrame(loop);
  }
  stop() {
    this.stopped = true;
    cancelAnimationFrame(this.frameId);
    this.animation = null;
  }
  /**
   * Start a new animation process
   *
   * @param {FrameAction[]} frames - Frame list
   * @param {number} duration - total animation duration
   * @param {AnimationSuccessAction} onAnimateEnd - Animation callback function
   */
  startAnimation(frames, duration, onAnimateEnd) {
    this.finishAnimation();
    this.animation = {
      frames,
      duration,
      durationFrame: duration / frames.length,
      onAnimateEnd,
      startedAt: this.timer
    };
  }
  /**
   * End the current animation process and call the callback
   */
  accelerateAnimation(maxRemainingMs) {
    if (!this.animation) return;
    const current = this.animation;
    const index = Math.max(0, Math.min(
      current.frames.length - 1,
      Math.round((this.timer - current.startedAt) / current.durationFrame)
    ));
    current.frames = current.frames.slice(index);
    current.duration = Math.min(current.durationFrame * current.frames.length, maxRemainingMs);
    current.durationFrame = current.duration / current.frames.length;
    current.startedAt = this.timer;
  }
  finishAnimation() {
    if (this.animation !== null) {
      this.animation.frames[this.animation.frames.length - 1]();
      if (this.animation.onAnimateEnd !== null) {
        this.animation.onAnimateEnd();
      }
    }
    this.animation = null;
  }
  /**
   * Recalculate the size of the displayed area, and update the page orientation
   */
  update() {
    this.boundsRect = null;
    const orientation = this.calculateBoundsRect();
    if (this.orientation !== orientation) {
      this.orientation = orientation;
      this.app.updateOrientation(orientation);
    }
  }
  /**
   * Calculate the size and position of the book depending on the parent element and configuration parameters
   */
  calculateBoundsRect() {
    let orientation = "landscape" /* LANDSCAPE */;
    const blockWidth = this.getBlockWidth();
    const middlePoint = {
      x: blockWidth / 2,
      y: this.getBlockHeight() / 2
    };
    const ratio = this.setting.width / this.setting.height;
    let pageWidth = this.setting.width;
    let pageHeight = this.setting.height;
    let left = middlePoint.x - pageWidth;
    if (this.setting.size === SizeType.STRETCH) {
      if (blockWidth < this.setting.minWidth * 2 && this.app.getSettings().usePortrait)
        orientation = "portrait" /* PORTRAIT */;
      pageWidth = orientation === "portrait" /* PORTRAIT */ ? this.getBlockWidth() : this.getBlockWidth() / 2;
      if (pageWidth > this.setting.maxWidth) pageWidth = this.setting.maxWidth;
      pageHeight = pageWidth / ratio;
      if (pageHeight > this.getBlockHeight()) {
        pageHeight = this.getBlockHeight();
        pageWidth = pageHeight * ratio;
      }
      left = orientation === "portrait" /* PORTRAIT */ ? middlePoint.x - pageWidth / 2 - pageWidth : middlePoint.x - pageWidth;
    } else {
      if (blockWidth < pageWidth * 2) {
        if (this.app.getSettings().usePortrait) {
          orientation = "portrait" /* PORTRAIT */;
          left = middlePoint.x - pageWidth / 2 - pageWidth;
        }
      }
    }
    this.boundsRect = {
      left,
      top: middlePoint.y - pageHeight / 2,
      width: pageWidth * 2,
      height: pageHeight,
      pageWidth
    };
    return orientation;
  }
  /**
   * Set the current parameters of the drop shadow
   *
   * @param {Point} pos - Shadow Position Start Point
   * @param {number} angle - The angle of the shadows relative to the book
   * @param {number} progress - Flipping progress in percent (0 - 100)
   * @param {FlipDirection} direction - Flipping Direction, the direction of the shadow gradients
   */
  setShadowData(pos, angle, progress, direction) {
    if (!this.app.getSettings().drawShadow) return;
    const maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;
    this.shadow = {
      pos,
      angle,
      width: this.getRect().pageWidth * 3 / 4 * progress / 100,
      opacity: (100 - progress) * maxShadowOpacity / 100 / 100,
      direction,
      progress: progress * 2
    };
  }
  /**
   * Clear shadow
   */
  clearShadow() {
    this.shadow = null;
  }
  /**
   * Get parent block offset width
   */
  getBlockWidth() {
    return this.app.getUI().getDistElement().offsetWidth;
  }
  /**
   * Get parent block offset height
   */
  getBlockHeight() {
    return this.app.getUI().getDistElement().offsetHeight;
  }
  /**
   * Get current flipping direction
   */
  getDirection() {
    return this.direction;
  }
  /**
   * Сurrent size and position of the book
   */
  getRect() {
    if (this.boundsRect === null) this.calculateBoundsRect();
    return this.boundsRect;
  }
  /**
   * Get configuration object
   */
  getSettings() {
    return this.app.getSettings();
  }
  /**
   * Get current book orientation
   */
  getOrientation() {
    return this.orientation;
  }
  /**
   * Set page area while flipping
   *
   * @param direction
   */
  setPageRect(pageRect) {
    this.pageRect = pageRect;
  }
  /**
   * Set flipping direction
   *
   * @param direction
   */
  setDirection(direction) {
    this.direction = direction;
  }
  /**
   * Set right static book page
   *
   * @param page
   */
  setRightPage(page) {
    if (page !== null) page.setOrientation(PageOrientation.RIGHT);
    this.rightPage = page;
  }
  /**
   * Set left static book page
   * @param page
   */
  setLeftPage(page) {
    if (page !== null) page.setOrientation(PageOrientation.LEFT);
    this.leftPage = page;
  }
  /**
   * Set next page at the time of flipping
   * @param page
   */
  setBottomPage(page) {
    if (page !== null)
      page.setOrientation(
        this.direction === FlipDirection.BACK ? PageOrientation.LEFT : PageOrientation.RIGHT
      );
    this.bottomPage = page;
  }
  /**
   * Set currently flipping page
   *
   * @param page
   */
  setFlippingPage(page) {
    if (page !== null)
      page.setOrientation(
        this.direction === FlipDirection.FORWARD && this.orientation !== "portrait" /* PORTRAIT */ ? PageOrientation.LEFT : PageOrientation.RIGHT
      );
    this.flippingPage = page;
  }
  /**
   * Coordinate conversion function. Window coordinates -> to book coordinates
   *
   * @param {Point} pos - Global coordinates relative to the window
   * @returns {Point} Coordinates relative to the book
   */
  convertToBook(pos) {
    const rect = this.getRect();
    return {
      x: pos.x - rect.left,
      y: pos.y - rect.top
    };
  }
  isSafari() {
    return this.safari;
  }
  /**
   * Coordinate conversion function. Window coordinates -> to current coordinates of the working page
   *
   * @param {Point} pos - Global coordinates relative to the window
   * @param {FlipDirection} direction  - Current flipping direction
   *
   * @returns {Point} Coordinates relative to the work page
   */
  convertToPage(pos, direction) {
    if (!direction) direction = this.direction;
    const rect = this.getRect();
    const x = direction === FlipDirection.FORWARD ? pos.x - rect.left - rect.width / 2 : rect.width / 2 - pos.x + rect.left;
    return {
      x,
      y: pos.y - rect.top
    };
  }
  /**
   * Coordinate conversion function. Coordinates relative to the work page -> Window coordinates
   *
   * @param {Point} pos - Coordinates relative to the work page
   * @param {FlipDirection} direction  - Current flipping direction
   *
   * @returns {Point} Global coordinates relative to the window
   */
  convertToGlobal(pos, direction) {
    if (!direction) direction = this.direction;
    if (pos == null) return null;
    const rect = this.getRect();
    const x = direction === FlipDirection.FORWARD ? pos.x + rect.left + rect.width / 2 : rect.width / 2 - pos.x + rect.left;
    return {
      x,
      y: pos.y + rect.top
    };
  }
  /**
   * Casting the coordinates of the corners of the rectangle in the coordinates relative to the window
   *
   * @param {RectPoints} rect - Coordinates of the corners of the rectangle relative to the work page
   * @param {FlipDirection} direction  - Current flipping direction
   *
   * @returns {RectPoints} Coordinates of the corners of the rectangle relative to the window
   */
  convertRectToGlobal(rect, direction) {
    if (!direction) direction = this.direction;
    return {
      topLeft: this.convertToGlobal(rect.topLeft, direction),
      topRight: this.convertToGlobal(rect.topRight, direction),
      bottomLeft: this.convertToGlobal(rect.bottomLeft, direction),
      bottomRight: this.convertToGlobal(rect.bottomRight, direction)
    };
  }
}
export {
  Orientation,
  Render
};
