import createNode from "./createNode";
import EventNode from "./EventNode";
import BaseNode from "./BaseNode";
import { idArray as idList } from "./adminIdClass";

class NewEvent {
  public cancelBubble = false;
  public cancelImmediateBubble = false;
  public target;
  public originalEvent;
  public returnValue = true;
  public type;

  private EventList = {
    HTMLEvent: Event,
    MouseEvent: MouseEvent,
    MutationEvent: MutationEvent,
    UIEvent: UIEvent,
  };

  public preventDefault() {
    this.originalEvent.preventDefault();
    this.returnValue = false;
  }
  public stopPropagation() {
    this.originalEvent.stopPropagation();
    this.cancelBubble = true;
  }
  public stopImmediatePropagation() {
    this.originalEvent.stopImmediatePropagation();
    this.cancelImmediateBubble = true;
  }
  public initMouseEvent( type: string ) {
    this.type = type;
    this.originalEvent.initMouseEvent.apply( this.originalEvent, arguments );
  }
  public initUIEvent( type: string ) {
    this.type = type;
    this.originalEvent.initUIEvent.apply( this.originalEvent, arguments );
  }
  public initMutationEvent( type: string ) {
    this.type = type;
    this.originalEvent.initMutationEvent.apply( this.originalEvent, arguments );
  }
  public initEvent( type: string ) {
    this.type = type;
    this.originalEvent.initEvent.apply( this.originalEvent, arguments );
  }

  constructor( type ) {
    if ( typeof type === "string" ) {
      this.originalEvent = new this.EventList[ type.split( /s$/ )[ 0 ] ]( type );
    } else {
      this.originalEvent = type;
      this.type = type.type;
    }
  }
};

class TextNode extends BaseNode {
  public textContent: string;
  public coreObject = {};

  constructor( text, gomlDoc ) {
    super( "#text", gomlDoc );
    this.textContent = text;
  }
}

class GomlDoc extends EventNode {

  public body;
  public head;
  public childNodes;
  public createEvent = ( type: string ) => {
    return new NewEvent( type );
  };

  public createElement( tagName: string ) {
    return createNode( tagName, this );
  }

  public createTextNode( text: string ) {// m.redrawとかでMithrilがtextNodeを生成することがある
    return new TextNode( text, this );
  }

  public getElementById( id: string ) {
    return idList[ id ] || null;
  }

  constructor () {
    super();
    this.body = createNode( "body", this );
    this.body.parentNode = this;
    this.head = createNode( "head", this );
    this.head.parentNode = this;

    this.childNodes = [ this.body, this.head ];
  }
}

export default GomlDoc;
