import { promisify } from 'util';
import { exec } from 'child_process';
const actualExec = promisify(exec);

export default async function (message, ws) {
  const patchList = [];
  const getPatches = await actualExec(
    `java -jar ${global.jarNames.cli} -a ${global.jarNames.integrations} -b ${global.jarNames.patchesJar} -l --with-packages`
  );
  let patchesText = getPatches.stdout;
  patchesText = patchesText.replace('\tdi', '\t di');
  const firstWord = patchesText.slice(0, patchesText.indexOf(' '));
  const patchRegex = new RegExp('\\t\\s([^\\t]+)', 'g');

  const patchesArray = patchesText.match(patchRegex);

  const pkgRegex = new RegExp(`${firstWord}\\s([^\\t]+)`, 'g');
  const pkgNameArray = patchesText.match(pkgRegex);
  const patchDescRegex = new RegExp(`\\t(.*) ${require('os').EOL}`, 'g');
  const patchDescsArray = patchesText.match(patchDescRegex);

  let index = -1;

  for (const patchName of patchesArray) {
    const patch = patchName.replace(firstWord, '').replace(/\s/g, '');
    index++;
    let isRooted = false;
    if (
      pkgNameArray[index].replace(firstWord, '').replace(/\s/g, '') !==
      global.jarNames.selectedApp
    ) {
      continue;
    }

    if (patch.includes('microg-support')) {
      isRooted = true;
    }

    if (patch.includes('hide-cast-button')) {
      isRooted = true;
    }

    patchList.push({
      name: patch,
      description: patchDescsArray[index]
        .replace('\t', '')
        .match(new RegExp(`\\t(.*) ${require('os').EOL}`))[1],
      isRooted
    });
  }

  return ws.send(
    JSON.stringify({
      event: 'patchList',
      patchList
    })
  );
}