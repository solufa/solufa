const idList = []; // todo: appendとremoveの反映

class BaseNode {

  public childNodes = [];
  public attributes = [];
  public parentNode;
  public tagName: string;
  public ownerDocument;
  public id: string;

  private attrList = {};
  private listenerList = {};

  public attrHook( name, value ) { return; }
  public removeHook( childNode ) { return; }
  public appendHook( childNode ) { return; }

  public addEventListener( type: string, listener ): void {
    const list = this.listenerList[ type ] || [];
    list.push( listener );
    this.listenerList[ type ] = list;
  }

  public removeEventListener( type: string, listener ): void {
    const list = this.listenerList[ type ];
    if ( !list ) {
      return;
    }
    const index = list.indexOf( listener );

    if ( index !== -1 ) {
      list.splice( index, 1 );
    }
  }

  public setAttribute( name: string, value: any ): void {
    if ( this.attrList[ name ] ) {
      this.attrList[ name ].value = value;
    } else {
      this.attributes.push( this.attrList[ name ] = {
        name,
        value,
      });
    }

    if ( name === "id" ) {
      if ( this.id ) {
        delete idList[ this.id ];
      }
      this.id = value;
      idList[ value ] = this;
    }

    this.attrHook( name, value );
  }

  public appendChild( child ): void {
    if ( child.parentNode ) {
      child.parentNode.removeChild( child );
    }

    this.childNodes.push( child );
    child.parentNode = this;
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
    this.appendHook( newNode );
  }

  public removeChild( childNode ): void {
    const index = this.childNodes.indexOf( childNode );
    if ( index !== -1 ) {
      this.childNodes.splice( index, 1 );
      childNode.parentNode = null;
      this.removeHook( childNode );
    }
  }

  public querySelector( selector: string ) {
    return idList[ selector.slice( 1 ) ];
  }

  constructor( tagName: string, gomlDoc ) {
    this.tagName = tagName;
    this.ownerDocument = gomlDoc;
  }
}

export default BaseNode;
