export const Blender_GetClusterCount:string = `
start = env.getnumber("start");
end = env.getnumber("end");

result = end - start + 1

env.setnumber("cluster", result);
`