group "default" {
  targets = ["core", "judge"]
}

target "core" {
  context = "./src/data-layer"
  dockerfile = "Dockerfile"
  tags = ["tnyuma/nextjudge-core:latest"]
  platforms = ["linux/amd64"]
}

target "basejudge" {
  context = "./src/judge"
  dockerfile = "Dockerfile.newbase"
  target = "prod"
  tags = ["tnyuma/nextjudge-basejudge:latest"]
  platforms = ["linux/amd64"]
}

target "judge" {
  context = "./src/judge"
  dockerfile = "Dockerfile.monolith"
  tags = ["tnyuma/nextjudge-judge:latest"]
  platforms = ["linux/amd64"]
  args = {
    BASEJUDGE = "tnyuma/nextjudge-basejudge:latest"
  }
  contexts = {
    "tnyuma/nextjudge-basejudge:latest" = "target:basejudge"
  }
}
