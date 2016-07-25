export default function createCanvas() {
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
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild( canvas );

  return { container, canvas };

};
