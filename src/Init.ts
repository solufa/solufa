/// <reference path="./refs/bundle.ts" />

"use strict";

// 消去予定　内部では使ってない
import * as m from "mithril";
// WebGL library
import * as three from "three";

// window.documentのmock
import GomlDoc from "./Goml/GomlDoc";

// rdrを更新する直前に呼び出す関数を登録させる
import { updateS as update } from "./update";

// 消去予定
import physics from "./Goml/physics";

const SolufaInit = ( version: string ) => {

  const canvas = document.createElement( "canvas" );
  const hasGl = (<any>window).WebGLRenderingContext && ( canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" ) );

  // HTMLとGOMLの構築待機関数のコールバックをキャッシュ
  let waitLoadFn = [];

  // HTMLとGOMLの構築待機関数
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

  // 消去予定
  (<any>Solufa).initPhysics = physics.init;

  // jQuery.noConflictと同じ役割
  (<any>Solufa).noConflict = function() {
    (<any>window).S = (<any>Solufa)._S;
  };

  // tslintのために書き換えた
  m.deps( Object.assign({}, window, {
    document: doc,
  }));

  (<any>window).Solufa = (<any>window).S = Solufa;
  (<any>window).THREE = three;

  console.log( "%cSolufa " + version,
    "font-size: 250%; text-shadow: 1px 1px 2px rgba(0,0,0,.8); color: #fff; font-weight: bold; font-family: Georgia; font-style: italic;" );

  return Solufa;

};

export default SolufaInit;
