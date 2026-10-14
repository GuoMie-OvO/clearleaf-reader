var PageOrientation = /* @__PURE__ */ ((PageOrientation2) => {
  PageOrientation2[PageOrientation2["LEFT"] = 0] = "LEFT";
  PageOrientation2[PageOrientation2["RIGHT"] = 1] = "RIGHT";
  return PageOrientation2;
})(PageOrientation || {});
var PageDensity = /* @__PURE__ */ ((PageDensity2) => {
  PageDensity2["SOFT"] = "soft";
  PageDensity2["HARD"] = "hard";
  return PageDensity2;
})(PageDensity || {});
class Page {
  /** State of the page on the basis of which rendering */
  state;
  /** Render object */
  render;
  /** Page Orientation */
  orientation;
  /** Density at creation */
  createdDensity;
  /** Density at the time of rendering (Depends on neighboring pages) */
  nowDrawingDensity;
  constructor(render, density) {
    this.state = {
      angle: 0,
      area: [],
      position: { x: 0, y: 0 },
      hardAngle: 0,
      hardDrawingAngle: 0
    };
    this.createdDensity = density;
    this.nowDrawingDensity = this.createdDensity;
    this.render = render;
  }
  /**
   * Set a constant page density
   * 
   * @param {PageDensity} density 
   */
  setDensity(density) {
    this.createdDensity = density;
    this.nowDrawingDensity = density;
  }
  /**
   * Set temp page density to next render
   * 
   * @param {PageDensity}  density 
   */
  setDrawingDensity(density) {
    this.nowDrawingDensity = density;
  }
  /**
   * Set page position
   * 
   * @param {Point} pagePos 
   */
  setPosition(pagePos) {
    this.state.position = pagePos;
  }
  /**
   * Set page angle
   * 
   * @param {number} angle 
   */
  setAngle(angle) {
    this.state.angle = angle;
  }
  /**
   * Set page crop area
   * 
   * @param {Point[]} area 
   */
  setArea(area) {
    this.state.area = area;
  }
  /**
   * Rotate angle for hard pages to next render
   * 
   * @param {number} angle 
   */
  setHardDrawingAngle(angle) {
    this.state.hardDrawingAngle = angle;
  }
  /**
   * Rotate angle for hard pages
   * 
   * @param {number} angle 
   */
  setHardAngle(angle) {
    this.state.hardAngle = angle;
    this.state.hardDrawingAngle = angle;
  }
  /**
   * Set page orientation
   * 
   * @param {PageOrientation} orientation 
   */
  setOrientation(orientation) {
    this.orientation = orientation;
  }
  /**
   * Get temp page density
   */
  getDrawingDensity() {
    return this.nowDrawingDensity;
  }
  /**
   * Get a constant page density
   */
  getDensity() {
    return this.createdDensity;
  }
  /**
   * Get rotate angle for hard pages
   */
  getHardAngle() {
    return this.state.hardAngle;
  }
}
export {
  Page,
  PageDensity,
  PageOrientation
};
