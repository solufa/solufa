import createNode from "./Goml/createNode";

const roots = [];

function setCanvas( render, gomlDoc ) {
  return function ( root, component ): void {
    if ( component ) {
      const index = roots.indexOf( root );
      if ( index === -1 ) {
        const container = document.createElement( "div" );
        container.style.position = "relative";
        container.style.height = "100%";

        const resizeIframe = document.createElement( "iframe" );
        resizeIframe.style.width = "100%";
        resizeIframe.style.height = "100%";
        resizeIframe.style.position = "absolute";
        resizeIframe.style.zIndex = "-1";
        resizeIframe.style.top = "0";
        resizeIframe.style.left = "0";
        resizeIframe.style.verticalAlign = "bottom";
        resizeIframe.setAttribute( "frameborder", "0" );
        container.appendChild( resizeIframe );

        const canvas = document.createElement( "canvas" );
        container.appendChild( canvas );

        root.appendChild( container );
        roots.push( root );

        const gomlCanvas = createNode( "canvas", gomlDoc );
        gomlCanvas.coreObject = canvas;
        gomlDoc.head.appendChild( gomlCanvas );
        render( gomlCanvas, component );

        window.frames[ window.frames.length - 1 ].addEventListener( "resize",
          gomlCanvas.childNodes[ 0 ].resize.bind( gomlCanvas.childNodes[ 0 ] ), false );

      }
    } else {
      render( gomlDoc.body, root );
    }
  };
}

export default setCanvas;
