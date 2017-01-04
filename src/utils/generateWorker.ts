// physicsでしか使ってないので廃止してよさそう

export default function( fn ) {
  const worker = new Worker( window.URL.createObjectURL(
    new Blob([ "!" + fn.toString() + "();" ], {type: "text/javascript" })
  ) );
  worker.postMessage = worker.webkitPostMessage || worker.postMessage;
  return worker;
};
