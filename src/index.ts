import { init, type Tool } from "./pass.js";
import { passList } from "./tools/list.js";
import { passGet } from "./tools/get.js";
import { passSave } from "./tools/save.js";
import { passSearch } from "./tools/search.js";
import { passOtp } from "./tools/otp.js";

export default function register(api: {
  registerTool: (tool: Tool, opts?: { optional?: boolean }) => void;
  getConfig?: () => { storePath?: string };
}) {
  init(api.getConfig?.());

  api.registerTool(passList);
  api.registerTool(passGet);
  api.registerTool(passSave);
  api.registerTool(passSearch);
  api.registerTool(passOtp, { optional: true });
}
