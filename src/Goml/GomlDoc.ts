import createNode from "./createNode";

class GomlDoc {
  public body;
  public head;

  public createElement( tagName: string ) {
    return createNode( tagName, this );
  }

  constructor () {
    this.body = createNode( "body", this );
    this.body.parentNode = this;
    this.head = createNode( "head", this );
    this.head.parentNode = this;
  }
}

export default GomlDoc;
