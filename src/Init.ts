/// <reference path="./refs/bundle.ts" />

"use strict";
import "babel-polyfill";

import * as m from "mithril";
import * as three from "three";

import GomlDoc from "./Goml/GomlDoc";
import setCanvas from "./setCanvas";
import { updateJ3 as update } from "./update";

const canvas = document.createElement( "canvas" );
const hasGl = (<any>window).WebGLRenderingContext && ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) );

let waitLoadFn = [];

function jThree( callback: ( m: any ) => void, error: () => void ) {
  if ( !hasGl ) {
    error();
  } else if ( document.readyState === "loading" ) {
    waitLoadFn.push( callback );
  } else {
    callback( m );
  }
}

if ( document.readyState === "loading" ) {
  window.addEventListener( "DOMContentLoaded", () => {
    waitLoadFn.forEach( ( fn ) => {
      fn( m );
    });
    waitLoadFn = null;
  }, false );
}

(<any>jThree).m = m;
(<any>jThree).THREE = three;
(<any>jThree).update = update;

const JthreeInit = {
  init: () => {
    const doc = new GomlDoc();

    m.deps({
      cancelAnimationFrame: window.cancelAnimationFrame,
      document: doc,
      location: window.location,
      requestAnimationFrame: window.requestAnimationFrame,
    });

    m.render = setCanvas( m.render, doc );

    (<any>window).m = m;
    (<any>window).jThree  = (<any>window).j3  = jThree;

  },
};

export default JthreeInit;
