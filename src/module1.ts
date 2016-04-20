export default function (): string {

  async function Main() {
      // 実行時即表示
      console.log("a");

      // このawaitで2秒間待機してくれる(風に見せかけることが出来る)
      await new Promise((resolve) => {
          setTimeout(resolve, 2000);
      });

      // 2秒後に表示
      console.log("b");

      // このawaitで1秒間待機してくれる(風に見せかけることが出来る)
      await new Promise((resolve) => {
          setTimeout(resolve, 1000);
      });

      // 1秒後(実行から合計3秒後)に表示
      console.log("c");
  }

  Main();

    return "module1";
}
