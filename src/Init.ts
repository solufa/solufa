/// <reference path="./refs/bundle.ts" />

"use strict";
import "babel-polyfill";

import * as m from "mithril";
import * as three from "three";

import GomlDoc from "./Goml/GomlDoc";
import { updateS as update } from "./update";

const SolufaInit = ( version: string ) => {

  const canvas = document.createElement( "canvas" );
  const hasGl = (<any>window).WebGLRenderingContext && ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) );

  let waitLoadFn = [];

  function Solufa( callback: ( m: any ) => void, error: () => void ) {
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

  (<any>Solufa).m = m;
  (<any>Solufa).THREE = three;
  (<any>Solufa).update = update;
  (<any>Solufa).document = doc;
  (<any>Solufa).version = version;
  (<any>Solufa)._S = (<any>window).S;
  (<any>Solufa).noConflict = function() {
     (<any>window).S = (<any>Solufa)._S;
  };

  m.deps({
    XMLHttpRequest: window.XMLHttpRequest,
    cancelAnimationFrame: window.cancelAnimationFrame,
    document: doc,
    location: window.location,
    requestAnimationFrame: window.requestAnimationFrame,
  });

  (<any>window).Solufa = (<any>window).S = Solufa;
  (<any>window).THREE = three;

  console.log( "%cSolufa " + version,
    "font-size: 250%; text-shadow: 1px 1px 2px rgba(0,0,0,.8); color: #fff; font-weight: bold; font-family: Georgia; font-style: italic;" );

  return Solufa;

};

export default SolufaInit;
