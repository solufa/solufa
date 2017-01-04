// window.documentのsolufa mock

import createNode from "./createNode";
import EventNode from "./EventNode";
import BaseNode from "./BaseNode";
import idList from "./adminId";
import { getGomlElement as getElement } from "./adminCoreObject";
import getElementsByClassName from "../utils/getElementsByClassName";

// HTML Event objectのmock
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

// m.redrawとかでMithrilがtextNodeを生成することがある
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
  public createEvent( type: string ) {
    return new NewEvent( type );
  }

  public createElement( tagName: string ) {
    return createNode( tagName, this );
  }

  public createTextNode( text: string ) {
    return new TextNode( text, this );
  }

  public getElementById( id: string ) {
    return idList[ id ] || null;
  }

  public getElementsByClassName( name: string ) {
    return getElementsByClassName( this, name, false );
  }

  public getElementByObject( object ) {
    let target = object;
    while ( !getElement( target ) && target.parent ) {
      target = target.parent;
    }
    return getElement( target );
  }

  constructor () {
    super();
    this.body = createNode( "body", this );
    this.body.parentNode = this;
    this.head = createNode( "head", this );
    this.head.parentNode = this;

    this.childNodes = [ this.head, this.body ];
  }
}

export default GomlDoc;
