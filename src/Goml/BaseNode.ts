import Style from "./Style";
import EventNode from "./EventNode";
import idList from "./adminId";
import getElementsByClassName from "../utils/getElementsByClassName";

// 全てのsolufa element の基幹クラス
// HTML elementのAPIをトレース
// GomlDocもEventNodeを継承する
class BaseNode extends EventNode {

  public childNodes = [];
  public attributes = [];
  public parentNode;
  public tagName: string;
  public nodeName: string;
  public ownerDocument;
  public style;

  private attrList = {};
  private _id;
  private _className;

  get id(): string {
      return this._id;
  }
  set id( value: string ) {
    if ( this._id ) {
      delete idList[ this._id ];
    }
    this._id = value;
    idList[ value ] = this;
  }

  get className(): string {
      return this._className;
  }
  set className( value: string ) {
    this._className = value;
  }

  public setAttrHook( name, value ) { return; }
  public getAttrHook( name ) { return this.attrList[ name ] ? this.attrList[ name ].value : null; }
  public removeHook( childNode ) { return; }
  public appendHook( childNode ) { return; }
  public removedHook( parentNode ) { return; }
  public appendedHook( parentNode ) { return; }

  public setAttribute( name: string, value: any ): void {
    if ( this.attrList[ name ] ) {
      this.attrList[ name ].value = value;
    } else {
      this.attributes.push( this.attrList[ name ] = {
        name,
        value,
      });
    }

    switch ( name ) {
    case "id":
      this.id = value;
      break;
    case "class":
      this.className = value;
      break;
    }

    this.setAttrHook( name, value );
  }

  public getAttribute( name: string ) {

    let value;

    switch ( name ) {
    case "id":
      value = this.id;
      break;
    case "class":
      value = this.className;
      break;
    default:
      value = this.getAttrHook( name );
      break;
    }
    return value;
  }

  public appendChild( child ): void {
    if ( child.parentNode ) {
      child.parentNode.removeChild( child );
    }

    this.childNodes.push( child );
    child.parentNode = this;
    this._resetChildHandlerTypeList();
    this.appendHook( child );
    child.appendedHook( this );
  }

  public insertBefore( newNode, node ): void {
    if ( newNode.parentNode ) {
      newNode.parentNode.removeChild( newNode );
    }

    const index = this.childNodes.indexOf( node );
    if ( index === -1 ) {
      this.childNodes.push( newNode );
    } else {
      this.childNodes.splice( index, 0, newNode );
    }
    newNode.parentNode = this;
    this._resetChildHandlerTypeList();
    this.appendHook( newNode );
    newNode.appendedHook( this );
  }

  public removeChild( childNode ): void {
    const index = this.childNodes.indexOf( childNode );
    if ( index !== -1 ) {
      this.childNodes.splice( index, 1 );
      childNode.parentNode = null;
      this._resetChildHandlerTypeList();
      this.removeHook( childNode );
      childNode.removedHook( this );
    }
  }

  public querySelector( selector: string ) {
    if ( /^#/.test( selector ) ) {
      return idList[ selector.slice( 1 ) ] || null;
    } else if ( /^\./.test( selector ) ) {
      return getElementsByClassName( this, selector.slice( 1 ), true );
    }
  }

  public querySelectorAll( selector: string ) {
    const arr = [];
    if ( /^#/.test( selector ) ) {
      let elem = idList[ selector.slice( 1 ) ];
      if ( elem ) {
        arr.push( elem );
      }
    } else if ( /^\./.test( selector ) ) {
      Array.prototype.push.apply( arr, getElementsByClassName( this, selector.slice( 1 ), false ) );
    }
    return arr;
  }

  constructor( tagName: string, gomlDoc ) {
    super();
    this.tagName = this.nodeName = tagName;
    this.ownerDocument = gomlDoc;
    this.style = new Style( this );
  }
}

export default BaseNode;
