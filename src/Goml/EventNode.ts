class EventNode {
  public childNodes;
  public parentNode;
  public tagName;
  public _allHandlerTypeList = []; // NodeList.tsで使う

  private handlerList = {};
  private handlerTypeList = [];
  private childHandlerTypeList = []; // [ type, type,,,]

  public _resetChildHandlerTypeList() { // BaseNode.tsで使う
    let target = this;
    const iterateHandler = function( type ) {
      if ( target.childHandlerTypeList.indexOf( type ) === -1 ) {
        target.childHandlerTypeList.push( type );
      }
    };
    const iterateChild = function( child ) {
      if ( child.hasOwnProperty( "textContent" ) ) { return; }
      child.handlerTypeList.forEach( iterateHandler );
      child.childHandlerTypeList.forEach( iterateHandler );
    };
    while ( target ) {
      target.childHandlerTypeList.length = 0;
      target.childNodes.forEach( iterateChild );

      if ( target.tagName === "scene" ) {
        this._allHandlerTypeList.length = 0;
        Array.prototype.push.apply( this._allHandlerTypeList, this.childHandlerTypeList );
        this.handlerTypeList.forEach( type => {
          if ( this._allHandlerTypeList.indexOf( type ) === -1 ) {
            this._allHandlerTypeList.push( type );
          }
        });
      }

      target = target.parentNode;

    }
  }

  public addEventListener( type: string, listener ): void {
    let list = this.handlerList[ type ];
    if ( !list ) {
      this.handlerList[ type ] = list = [];
      this._resetHandlerTypeList();
      if ( this.parentNode ) {
        this.parentNode._resetChildHandlerTypeList();
      }
    }
    list.push( listener );
  }

  public removeEventListener( type: string, listener ): void {
    const list = this.handlerList[ type ];
    if ( !list ) {
      return;
    }
    const index = list.indexOf( listener );

    if ( index !== -1 ) {
      list.splice( index, 1 );
    }

    if ( !list.length ) {
      delete this.handlerList[ type ];
      this._resetHandlerTypeList();
      if ( this.parentNode ) {
        this.parentNode._resetChildHandlerTypeList();
      }
    }
  }

  public dispatchEvent( evt ): void {

    evt.target = this;
    let target = this;
    let i;
    let l;

    while ( !evt.cancelBubble && !evt.cancelImmediateBubble && target ) {

      let list = target.handlerList[ evt.type ];

      if ( list ) {
        evt.currentTarget = target;
        for ( i = 0, l = list.length; i < l; i++ ) {
            evt.calcelBubble = list[ i ].call( target, evt ) === false || evt.cancelBubble;
            if ( evt.cancelImmediateBubble ) {
              break;
            }
        }
      }

      target = target.parentNode;
    }
  }

  private _resetHandlerTypeList() {
    const list = this.handlerTypeList;
    list.length = 0;

    for ( let name in this.handlerList ) {
      if ( 1 ) { // for inではなぜかifが必要
        list.push( name );
      }
    }
  }

};


for ( let key in window ) {
  if ( /^on/.test( key ) ) {
    const type = "_" + key;
    Object.defineProperty( EventNode.prototype, key, {
      get: function() {
        return this[ type ];
      },
      set: function( callback ) {
        if ( this[ type ] ) {
          this.removeEventListener( type.slice( 3 ), this[ type ], false );
          this[ type ] = null;
        }

        if ( typeof callback === "function" ) {
          this[ type ] = callback;
          this.addEventListener( type.slice( 3 ), callback, false );
        }
      },
    } );
  }
}

export default EventNode;
