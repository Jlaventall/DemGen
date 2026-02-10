# setup_env.ps1
# Sets up the environment for DemGen development by adding Node.js to the PATH.

$NodePath = "C:\Program Files\nodejs"

if (Test-Path $NodePath) {
    echo "Found Node.js at $NodePath"
    $env:Path = "$NodePath;$env:Path"
    echo "Added Node.js to PATH for this session."
    node --version
    npm --version
} else {
    echo "Error: Node.js not found at $NodePath. Please update this script with the correct path."
}
