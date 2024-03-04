FROM ubuntu:latest AS nextjudge-jail
# First, build nsjail
WORKDIR /

RUN apt-get update && \
  apt-get install -y curl unzip git autoconf bison flex gcc g++ libnl-route-3-dev libprotobuf-dev libseccomp-dev libtool make pkg-config protobuf-compiler

RUN git clone https://github.com/google/nsjail.git
RUN cd /nsjail && make && mv /nsjail/nsjail /bin && rm -rf -- /nsjail

# Install Bun into final Ubuntu image
RUN curl -fsSL https://bun.sh/install | bash

# Build our Bun application
FROM oven/bun:slim as base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release

# Create final image
FROM nextjudge-jail as final
WORKDIR /app

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app .
COPY --from=prerelease /app/package.json .

# Create the user that runs the compilation scripts
RUN groupadd -g 99999 NEXTJUDGE_USER_GROUP
RUN useradd NEXTJUDGE_USER -u 99999 -g 99999 -s /bin/bash

RUN mkdir /build_chroot

ENV PATH="${PATH}:/root/.bun/bin"

CMD [ "bun", "run", "src/index.ts" ]

