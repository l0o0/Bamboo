const esbuild = require("esbuild");
const compressing = require("compressing");
const path = require("path");
const fs = require("fs");
const process = require("process");
const replace = require("replace-in-file");
const {
    name,
    author,
    descriptionenUS,
    descriptionzhCN,
    homepage,
    version,
    config,
} = require("./package.json");

function copyFileSync(source, target) {
    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    // Copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

function clearFolder(target) {
    if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
    }

    fs.mkdirSync(target, { recursive: true });
}

function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),
        "m+": (date.getMonth() + 1).toString(),
        "d+": date.getDate().toString(),
        "H+": date.getHours().toString(),
        "M+": date.getMinutes().toString(),
        "S+": date.getSeconds().toString(),
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(
                ret[1],
                ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
            );
        }
    }
    return fmt;
}

async function main() {
    const t = new Date();
    const buildTime = dateFormat("YYYY-mm-dd HH:MM:SS", t);
    const buildDir = "builds";

    console.log(
        `[Build] BUILD_DIR=${buildDir}, VERSION=${version}, BUILD_TIME=${buildTime}`
    );

    clearFolder(buildDir);

    copyFolderRecursiveSync("addon", buildDir);

    copyFileSync("update-template.json", "update.json");
    copyFileSync("update-template.rdf", "update.rdf");

    await esbuild
        .build({
            entryPoints: ["src/index.ts"],
            bundle: true,
            // Entry should be the same as addon/chrome/content/overlay.xul
            outfile: path.join(buildDir, "addon/chrome/content/scripts/index.js"),
            // minify: true,
        })
        .catch(() => process.exit(1));

    console.log("[Build] Run esbuild OK");

    const optionsAddon = {
        files: [
            path.join(buildDir, "**/*.rdf"),
            path.join(buildDir, "**/*.dtd"),
            path.join(buildDir, "**/*.xul"),
            path.join(buildDir, "**/*.xhtml"),
            path.join(buildDir, "**/*.json"),
            path.join(buildDir, "addon/defaults", "**/*.js"),
            path.join(buildDir, "addon/chrome.manifest"),
            path.join(buildDir, "addon/manifest.json"),
            path.join(buildDir, "addon/bootstrap.js"),
            "update.json",
            "update.rdf",
        ],
        from: [
            /__author__/g,
            /__descriptionzhCN__/g,
            /__descriptionenUS__/g,
            /__homepage__/g,
            /__releasepage__/g,
            /__updaterdf__/g,
            /__addonName__/g,
            /__addonID__/g,
            /__addonRef__/g,
            /__buildVersion__/g,
            /__buildTime__/g,
        ],
        to: [
            author,
            descriptionzhCN,
            descriptionenUS,
            homepage,
            config.releasepage,
            config.updaterdf,
            config.addonName,
            config.addonID,
            config.addonRef,
            version,
            buildTime,
        ],
        countMatches: true,
    };

    _ = replace.sync(optionsAddon);
    console.log(
        "[Build] Run replace in ",
        _.filter((f) => f.hasChanged).map(
            (f) => `${f.file} : ${f.numReplacements} / ${f.numMatches}`
        )
    );

    console.log("[Build] Replace OK");

    console.log("[Build] Addon prepare OK");

    compressing.zip.compressDir(
        path.join(buildDir, "addon"),
        path.join(buildDir, `${name}.xpi`),
        {
            ignoreBase: true,
        }
    );

    console.log("[Build] Addon pack OK");
    console.log(
        `[Build] Finished in ${(new Date().getTime() - t.getTime()) / 1000} s.`
    );
}

main();