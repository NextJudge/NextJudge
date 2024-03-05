import { Button } from '../components/ui/button'

import React from 'react'

const home = () => {
  return (
    <div>
      <div className="text-left text-2xl pl-9 ">
        Welcome Back!
      </div>
        <div>
           <div className='text-left text-xl pl-9'>
            Recent Submissions
            </div>
          <Button>This is the test home page</Button>
        </div>
    </div>
  )
}

export default home
