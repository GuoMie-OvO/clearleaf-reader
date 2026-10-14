import { HTMLPage } from "../Page/HTMLPage";
import { PageCollection } from "./PageCollection";
import { PageDensity } from "../Page/Page";
class HTMLPageCollection extends PageCollection {
  element;
  pagesElement;
  constructor(app, render, element, items) {
    super(app, render);
    this.element = element;
    this.pagesElement = items;
  }
  load() {
    for (const pageElement of this.pagesElement) {
      const page = new HTMLPage(
        this.render,
        pageElement,
        pageElement.dataset["density"] === "hard" ? PageDensity.HARD : PageDensity.SOFT
      );
      page.load();
      this.pages.push(page);
    }
    this.createSpread();
  }
}
export {
  HTMLPageCollection
};
