var SizeType = /* @__PURE__ */ ((SizeType2) => {
  SizeType2["FIXED"] = "fixed";
  SizeType2["STRETCH"] = "stretch";
  return SizeType2;
})(SizeType || {});
class Settings {
  _default = {
    startPage: 0,
    size: "fixed" /* FIXED */,
    width: 0,
    height: 0,
    minWidth: 0,
    maxWidth: 0,
    minHeight: 0,
    maxHeight: 0,
    drawShadow: true,
    flippingTime: 1e3,
    usePortrait: true,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 1,
    showCover: false,
    mobileScrollSupport: true,
    swipeDistance: 30,
    clickEventForward: true,
    useMouseEvents: true,
    showPageCorners: true,
    disableFlipByClick: false
  };
  /**
   * Processing parameters received from the user. Substitution default values
   *
   * @param userSetting
   * @returns {FlipSetting} Сonfiguration object
   */
  getSettings(userSetting) {
    const result = this._default;
    Object.assign(result, userSetting);
    if (result.size !== "stretch" /* STRETCH */ && result.size !== "fixed" /* FIXED */)
      throw new Error('Invalid size type. Available only "fixed" and "stretch" value');
    if (result.width <= 0 || result.height <= 0) throw new Error("Invalid width or height");
    if (result.flippingTime <= 0) throw new Error("Invalid flipping time");
    if (result.size === "stretch" /* STRETCH */) {
      if (result.minWidth <= 0) result.minWidth = 100;
      if (result.maxWidth < result.minWidth) result.maxWidth = 2e3;
      if (result.minHeight <= 0) result.minHeight = 100;
      if (result.maxHeight < result.minHeight) result.maxHeight = 2e3;
    } else {
      result.minWidth = result.width;
      result.maxWidth = result.width;
      result.minHeight = result.height;
      result.maxHeight = result.height;
    }
    return result;
  }
}
export {
  Settings,
  SizeType
};
