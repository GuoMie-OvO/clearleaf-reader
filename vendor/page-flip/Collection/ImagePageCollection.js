import { ImagePage } from "../Page/ImagePage";
import { PageCollection } from "./PageCollection";
import { PageDensity } from "../Page/Page";
class ImagePageCollection extends PageCollection {
  imagesHref;
  constructor(app, render, imagesHref) {
    super(app, render);
    this.imagesHref = imagesHref;
  }
  load() {
    for (const href of this.imagesHref) {
      const page = new ImagePage(this.render, href, PageDensity.SOFT);
      page.load();
      this.pages.push(page);
    }
    this.createSpread();
  }
}
export {
  ImagePageCollection
};
