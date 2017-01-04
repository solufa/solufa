// エラーメッセージを他の方法で出力するようになるかもしれないと思って抽象化した
export default function( message: string ) {
  console.error( message );
};
