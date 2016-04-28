/// <reference path="./refs/bundle.ts" />

"use strict";
import "babel-polyfill";

import * as m from "mithril";
import * as three from "three";

import GomlDoc from "./Goml/GomlDoc";
import { updateJ3 as update } from "./update";

const JthreeInit = () => {

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

  const doc = new GomlDoc;

  (<any>jThree).m = m;
  (<any>jThree).THREE = three;
  (<any>jThree).update = update;
  (<any>jThree).document = doc;

  m.deps({
    cancelAnimationFrame: window.cancelAnimationFrame,
    document: doc,
    location: window.location,
    requestAnimationFrame: window.requestAnimationFrame,
  });

  (<any>window).m = m;
  (<any>window).jThree  = (<any>window).j3  = jThree;

};

export default JthreeInit;
