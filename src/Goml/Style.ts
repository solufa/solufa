import * as THREE from "three";
import traverse from "../utils/traverse";

function toArr( vec ): [ number ] {
  return [ vec.x, vec.y, vec.z ];
}

function setVec( vec, arr ) {
  vec.set( arr[ 0 ], arr[ 1 ], arr[ 2 ] );
}

function qToArr( quat ): [ number ] {
  return [ quat.x, quat.y, quat.z, quat.w ];
}

function setQuat( quat, arr ) {
  quat.set( arr[ 0 ], arr[ 1 ], arr[ 2 ], arr[ 3 ] );
}

function applyOpacity( elem, opacity ) {
  if ( elem.coreObject.material ) {
    Object.assign( elem.coreObject.material, {
      opacity: elem.style.opacity * opacity,
      transparent: true,
    });
  }
  return elem.style.opacity * opacity;
}

function cToObj( color ) {
  return { b: color.b, g: color.g, r: color.r };
}

class Style {
  private target;
  private _lookAt;
  private _opacity;
  private _vec3 = new THREE.Vector3;
  private _rotateAxis = new THREE.Vector3;
  private _normalizedRotateAxis = new THREE.Vector3;
  private _rotateAngle = 0;

  get pos() {
    return toArr( this.target.coreObject.position );
  }
  set pos( array ) {
    setVec( this.target.coreObject.position, array );
  }
  get posX(): number {
    return this.target.coreObject.position.x;
  }
  set posX( x: number ) {
    this.target.coreObject.position.x = x;
  }
  get posY(): number {
    return this.target.coreObject.position.y;
  }
  set posY( y: number ) {
    this.target.coreObject.position.y = y;
  }
  get posZ(): number {
    return this.target.coreObject.position.z;
  }
  set posZ( z: number ) {
    this.target.coreObject.position.z = z;
  }

  get worldPos() {
    this._vec3.copy( this.target.coreObject.position );
    this.target.parentNode.coreObject.localToWorld( this._vec3 );
    return toArr( this._vec3 );
  }

  set worldPos( array ) {
    this.target.coreObject.position.set( array[ 0 ], array[ 1 ], array[ 2 ] );
    this.target.parentNode.coreObject.worldToLocal( this.target.coreObject.position );
  }

  get scale() {
    return toArr( this.target.coreObject.scale );
  }
  set scale( array ) {
    setVec( this.target.coreObject.scale, typeof array === "number" ? [ array, array, array ] : array );
  }
  get scaleX(): number {
    return this.target.coreObject.scale.x;
  }
  set scaleX( x: number ) {
    this.target.coreObject.scale.x = x;
  }
  get scaleY(): number {
    return this.target.coreObject.scale.y;
  }
  set scaleY( y: number ) {
    this.target.coreObject.scale.y = y;
  }
  get scaleZ(): number {
    return this.target.coreObject.scale.z;
  }
  set scaleZ( z: number ) {
    this.target.coreObject.scale.z = z;
  }

  get up() {
    return toArr( this.target.coreObject.up );
  }
  set up( array ) {
    setVec( this.target.coreObject.up, array );
  }
  get upX(): number {
    return this.target.coreObject.up.x;
  }
  set upX( x: number ) {
    this.target.coreObject.up.x = x;
  }
  get upY(): number {
    return this.target.coreObject.up.y;
  }
  set upY( y: number ) {
    this.target.coreObject.up.y = y;
  }
  get upZ(): number {
    return this.target.coreObject.up.z;
  }
  set upZ( z: number ) {
    this.target.coreObject.up.z = z;
  }

  get rotate() {
    return toArr( this.target.coreObject.rotation );
  }
  set rotate( array ) {
    setVec( this.target.coreObject.rotation, array );
  }
  get rotateX(): number {
    return this.target.coreObject.rotation.x;
  }
  set rotateX( x: number ) {
    this.target.coreObject.rotation.x = x;
  }
  get rotateY(): number {
    return this.target.coreObject.rotation.y;
  }
  set rotateY( y: number ) {
    this.target.coreObject.rotation.y = y;
  }
  get rotateZ(): number {
    return this.target.coreObject.rotation.z;
  }
  set rotateZ( z: number ) {
    this.target.coreObject.rotation.z = z;
  }

  get quat() {
    return qToArr( this.target.coreObject.quaternion );
  }
  set quat( array ) {
    setQuat( this.target.coreObject.quaternion, array );
  }
  get quatX(): number {
    return this.target.coreObject.quaternion.x;
  }
  set quatX( x: number ) {
    this.target.coreObject.quaternion.x = x;
  }
  get quatY(): number {
    return this.target.coreObject.quaternion.y;
  }
  set quatY( y: number ) {
    this.target.coreObject.quaternion.y = y;
  }
  get quatZ(): number {
    return this.target.coreObject.quaternion.z;
  }
  set quatZ( z: number ) {
    this.target.coreObject.quaternion.z = z;
  }
  get quatW(): number {
    return this.target.coreObject.quaternion.w;
  }
  set quatW( w: number ) {
    this.target.coreObject.quaternion.w = w;
  }

  get rotateAxis() {
    return toArr( this._rotateAxis );
  }
  set rotateAxis( array ) {
    setVec( this._rotateAxis, array );
    this.target.coreObject.quaternion.setFromAxisAngle(
      this._normalizedRotateAxis.copy( this._rotateAxis ).normalize(),
      this._rotateAngle
    );
  }
  get rotateAxisX(): number {
    return this._rotateAxis.x;
  }
  set rotateAxisX( x: number ) {
    this._rotateAxis.x = x;
    this.target.coreObject.quaternion.setFromAxisAngle(
      this._normalizedRotateAxis.copy( this._rotateAxis ).normalize(),
      this._rotateAngle
    );
  }
  get rotateAxisY(): number {
    return this._rotateAxis.y;
  }
  set rotateAxisY( y: number ) {
    this._rotateAxis.y = y;
    this.target.coreObject.quaternion.setFromAxisAngle(
      this._normalizedRotateAxis.copy( this._rotateAxis ).normalize(),
      this._rotateAngle
    );
  }
  get rotateAxisZ(): number {
    return this._rotateAxis.z;
  }
  set rotateAxisZ( z: number ) {
    this._rotateAxis.z = z;
    this.target.coreObject.quaternion.setFromAxisAngle(
      this._normalizedRotateAxis.copy( this._rotateAxis ).normalize(),
      this._rotateAngle
    );
  }
  get rotateAngle(): number {
    return this._rotateAngle;
  }
  set rotateAngle( angle: number ) {
    this._rotateAngle = angle;
    this.target.coreObject.quaternion.setFromAxisAngle(
      this._normalizedRotateAxis,
      angle
    );
  }

  get lookAt() {
    return toArr( this._lookAt );
  }
  set lookAt( array ) {
    setVec( this._lookAt, array );
    this.target.coreObject.lookAt( this._lookAt );
  }
  get lookAtX(): number {
    return this._lookAt.x;
  }
  set lookAtX( x: number ) {
    this._lookAt.x = x;
    this.target.coreObject.lookAt( this._lookAt );
  }
  get lookAtY(): number {
    return this._lookAt.y;
  }
  set lookAtY( y: number ) {
    this._lookAt.y = y;
    this.target.coreObject.lookAt( this._lookAt );
  }
  get lookAtZ(): number {
    return this._lookAt.z;
  }
  set lookAtZ( z: number ) {
    this._lookAt.z = z;
    this.target.coreObject.lookAt( this._lookAt );
  }

  get opacity(): number {
    return this._opacity;
  }
  set opacity( opacity: number ) {
    this._opacity = opacity;
    // 子孫要素全てに反映させる
    traverse( this.target, applyOpacity, opacity );
  }

  get color() {
    return cToObj( this.target.coreObject.material.color );
  }
  set color( value ) {
    this.target.coreObject.material.color.set( value );
  }
  get colorR(): number {
    return this.target.coreObject.material.color.r;
  }
  set colorR( value ) {
    this.target.coreObject.material.color.r = value;
  }
  get colorG(): number {
    return this.target.coreObject.material.color.g;
  }
  set colorG( value ) {
    this.target.coreObject.material.color.g = value;
  }
  get colorB(): number {
    return this.target.coreObject.material.color.b;
  }
  set colorB( value ) {
    this.target.coreObject.material.color.b = value;
  }

  get lightColor() {
    return cToObj( this.target.coreObject.color );
  }
  set lightColor( value ) {
    this.target.coreObject.color.set( value );
  }
  get lightColorR(): number {
    return this.target.coreObject.color.r;
  }
  set lightColorR( value ) {
    this.target.coreObject.color.r = value;
  }
  get lightColorG(): number {
    return this.target.coreObject.color.g;
  }
  set lightColorG( value ) {
    this.target.coreObject.color.g = value;
  }
  get lightColorB(): number {
    return this.target.coreObject.color.b;
  }
  set lightColorB( value ) {
    this.target.coreObject.color.b = value;
  }

  constructor( target ) {
    this.target = target;
    this._lookAt = new THREE.Vector3;
    this._opacity = 1;
  }
}

export default Style;
