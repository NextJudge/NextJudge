variable "DOCKERHUB_NAMESPACE" {
  default = "nextjudge"
}

group "default" {
  targets = ["core", "judge"]
}

target "core" {
  context = "./src/data-layer"
  dockerfile = "Dockerfile"
  tags = ["${DOCKERHUB_NAMESPACE}/nextjudge-core:latest"]
  platforms = ["linux/amd64"]
}

target "basejudge" {
  context = "./src/judge"
  dockerfile = "Dockerfile.newbase"
  target = "prod"
  tags = ["${DOCKERHUB_NAMESPACE}/nextjudge-basejudge:latest"]
  platforms = ["linux/amd64"]
}

target "judge" {
  context = "./src/judge"
  dockerfile = "Dockerfile.monolith"
  tags = ["${DOCKERHUB_NAMESPACE}/nextjudge-judge:latest"]
  platforms = ["linux/amd64"]
  args = {
    BASEJUDGE = "${DOCKERHUB_NAMESPACE}/nextjudge-basejudge:latest"
  }
  contexts = {
    "${DOCKERHUB_NAMESPACE}/nextjudge-basejudge:latest" = "target:basejudge"
  }
}
