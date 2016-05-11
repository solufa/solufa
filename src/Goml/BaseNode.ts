import Style from "./Style";
import EventNode from "./EventNode";
import { idArray as idList, classArray as classList } from "./adminIdClass"; // Todo: appendとremoveの反映

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
      return this.getAttribute( "class" );
  }
  set className( value: string ) {
    if ( !value ) { return; } // Todo: removeClass

    if ( this._className ) {
      this._className.split( " " ).forEach( className => {
        classList[ className ].splice( classList[ className ].indexOf( this ), 1 );
        if ( !classList[ className ].length ) {
          delete classList[ className ];
        }
      });
    }

    this._className = value;
    value.split( " " ).forEach( className => {
      const list = classList[ className ] || [];
      list.push( this );
      classList[ className ] = list;
    });
  }

  public setAttrHook( name, value ) { return; }
  public getAttrHook( name ) { return this.attrList[ name ] ? this.attrList[ name ].value : null; }
  public removeHook( childNode ) { return; }
  public appendHook( childNode ) { return; }

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
    return this.getAttrHook( name );
  }

  public appendChild( child ): void {
    if ( child.parentNode ) {
      child.parentNode.removeChild( child );
    }

    this.childNodes.push( child );
    child.parentNode = this;
    this._resetChildHandlerTypeList();
    this.appendHook( child );
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
  }

  public removeChild( childNode ): void {
    const index = this.childNodes.indexOf( childNode );
    if ( index !== -1 ) {
      this.childNodes.splice( index, 1 );
      childNode.parentNode = null;
      this._resetChildHandlerTypeList();
      this.removeHook( childNode );
    }
  }

  public querySelector( selector: string ) {
    if ( /^#/.test( selector ) ) {
      return idList[ selector.slice( 1 ) ] || null;
    } else if ( /^\./.test( selector ) ) {
      let list = classList[ selector.slice( 1 ) ];
      return list ? list[ 0 ] : null;
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
      let list = classList[ selector.slice( 1 ) ];
      if ( list ) {
        Array.prototype.push.apply( arr, list );
      }
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
