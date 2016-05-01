import Style from "./Style";
import EventNode from "./EventNode";

const idList = []; // Todo: appendとremoveの反映
const classList = [];

class BaseNode extends EventNode {

  public childNodes = [];
  public attributes = [];
  public parentNode;
  public tagName: string;
  public nodeName: string;
  public ownerDocument;
  public id: string;
  public className: string;
  public style;

  private attrList = {};

  public attrHook( name, value ) { return; }
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

      if ( this.id ) {
        delete idList[ this.id ];
      }
      this.id = value;
      idList[ value ] = this;
      break;
    case "class":

      if ( this.className ) {
        this.className.split( " " ).forEach( function( className ) {
          classList[ className ].splice( classList[ className ].indexOf( this ), 1 );
          if ( !classList[ className ].length ) {
            delete classList[ className ];
          }
        }.bind( this ));
      }

      this.className = value;
      value.split( " " ).forEach( function( className ) {
        const list = classList[ className ] || [];
        list.push( this );
        classList[ className ] = list;
      }.bind( this ));
      break;
    }

    this.attrHook( name, value );
  }

  public getAttribute( name: string ) {
    return this.attrList[ name ] ? this.attrList[ name ].value : null;
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

  constructor( tagName: string, gomlDoc ) {
    super();
    this.tagName = this.nodeName = tagName;
    this.ownerDocument = gomlDoc;
    this.style = new Style( this );
  }
}

export default BaseNode;
