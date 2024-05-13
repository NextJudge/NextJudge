import React from "react";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

export function Input() {
  return (
    <>
      <div>
        <Label>Input</Label>
        <div className="mt-2">
          <Card className="group relative">
            <div className="relative py-3">
              <div className="mx-3 mb-2 text-xs text-muted-foreground">
                score =
              </div>
              <div className="z-base-1 hidden rounded border group-hover:block border-border-quaternary dark:border-border-quaternary bg-layer-02 dark:bg-layer-02 absolute right-3 top-2.5 z-base-1">
                <div
                  className="relative cursor-pointer flex h-[22px] w-[22px] items-center justify-center bg-layer-02 dark:bg-layer-02 hover:bg-fill-tertiary dark:hover:bg-fill-tertiary rounded-[4px]"
                  data-state="closed"
                >
                  <div>
                    <div className="relative text-[12px] leading-[normal] p-[1px] before:block before:h-3 before:w-3 h-3.5 w-3.5 text-text-primary dark:text-text-primary">
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="far"
                        data-icon="clone"
                        className="svg-inline--fa fa-clone absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                      >
                        <path
                          fill="currentColor"
                          d="M64 464H288c8.8 0 16-7.2 16-16V384h48v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h64v48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16zM224 304H448c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H224c-8.8 0-16 7.2-16 16V288c0 8.8 7.2 16 16 16zm-64-16V64c0-35.3 28.7-64 64-64H448c35.3 0 64 28.7 64 64V288c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="font-mono mx-3 whitespace-pre-wrap break-all leading-5 text-label-1 dark:text-dark-label-1">
                <div className="break-words whitespace-pre-wrap overflow-scroll">
                  <div className="align-middle">
                    <div>[5,4,3,2,1]</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export function Expected() {
  return (
    <div className="flex h-full w-full flex-col space-y-2">
      <div className="flex text-xs font-medium text-label-3 dark:text-dark-label-3">
        Expected
      </div>
      <div className="mt-2">
        <Card className="group relative">
          <div className="relative py-3">
            <div className="font-mono relative mx-3 whitespace-pre-wrap break-all leading-5 text-label-1 dark:text-dark-label-1">
              <div className="z-base-1 hidden rounded border group-hover:block border-border-quaternary dark:border-border-quaternary bg-layer-02 dark:bg-layer-02 absolute right-0 top-0">
                <div
                  className="relative cursor-pointer flex h-[22px] w-[22px] items-center justify-center bg-layer-02 dark:bg-layer-02 hover:bg-fill-tertiary dark:hover:bg-fill-tertiary rounded-[4px]"
                  data-state="closed"
                >
                  <div>
                    <div data-state="closed">
                      <div className="relative text-[12px] leading-[normal] p-[1px] before:block before:h-3 before:w-3 h-3.5 w-3.5 text-text-primary dark:text-text-primary">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          data-prefix="far"
                          data-icon="clone"
                          className="svg-inline--fa fa-clone absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                          role="img"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                        >
                          <path
                            fill="currentColor"
                            d="M64 464H288c8.8 0 16-7.2 16-16V384h48v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h64v48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16zM224 304H448c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H224c-8.8 0-16 7.2-16 16V288c0 8.8 7.2 16 16 16zm-64-16V64c0-35.3 28.7-64 64-64H448c35.3 0 64 28.7 64 64V288c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64z"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <span>["</span>
              <span className="leading-3.5 text-green-s dark:text-dark-green-s ">
                Gold Medal","Silver Medal","Bronze Medal","4","5
              </span>
              <span>"]</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Output() {
  return (
    <div>
      <Label>Output</Label>
      <div className="mt-2">
        <Card className="group relative">
          <div className="relative py-3">
            <div className="z-base-1 hidden rounded border group-hover:block border-border-quaternary dark:border-border-quaternary bg-layer-02 dark:bg-layer-02 absolute right-3 top-2.5 z-base-1">
              <div
                className="relative cursor-pointer flex h-[22px] w-[22px] items-center justify-center bg-layer-02 dark:bg-layer-02 hover:bg-fill-tertiary dark:hover:bg-fill-tertiary rounded-[4px]"
                data-state="closed"
              >
                <div>
                  <div className="relative text-[12px] leading-[normal] p-[1px] before:block before:h-3 before:w-3 h-3.5 w-3.5 text-text-primary dark:text-text-primary">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="far"
                      data-icon="clone"
                      className="svg-inline--fa fa-clone absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M64 464H288c8.8 0 16-7.2 16-16V384h48v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h64v48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16zM224 304H448c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H224c-8.8 0-16 7.2-16 16V288c0 8.8 7.2 16 16 16zm-64-16V64c0-35.3 28.7-64 64-64H448c35.3 0 64 28.7 64 64V288c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="font-mono mx-3 whitespace-pre-wrap break-all leading-5 text-label-1 dark:text-dark-label-1">
              <div className="break-words whitespace-pre-wrap overflow-scroll">
                <div className="align-middle">
                  <div>[5,4,3,2,1]</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
