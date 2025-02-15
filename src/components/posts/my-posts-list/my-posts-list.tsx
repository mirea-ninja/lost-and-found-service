import { type PostItemReason } from '@prisma/client'
import Window from '@/components/form/window'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { api, type RouterInputs, type RouterOutputs } from '@/lib/api'
import React, { useState } from 'react'
import { formatDate } from '@/lib/format-date'
import Link from 'next/link'
import { Campus } from '@/lib/campus'
import Image from 'next/image'
import classNames from 'classnames/dedupe'
import PostStatusBadge from '@/components/posts/post-status-badge/post-status-badge'
import { useRouter } from 'next/router'

const pageSize = 5

interface MyPostsListProps {
  reason: PostItemReason
}

function MyPostSkeleton() {
  return (
    <li className='flex animate-pulse justify-between gap-x-6 py-5'>
      <div className='min-w-0'>
        <div className='mb-4 h-2.5 w-48 rounded-full bg-gray-200' />
        <div className='mb-2.5 h-2 w-64 rounded-full bg-gray-200' />
      </div>
      <div className='hidden sm:flex sm:flex-row sm:items-center sm:gap-x-4'>
        <div className='flex flex-col items-end'>
          <div className='mb-3 h-2 w-32 rounded-full bg-gray-200' />
          <div className='mb-2.5 h-2 w-60 rounded-full bg-gray-200' />
        </div>
        <ChevronRightIcon className='h-5 w-5 text-gray-500' />
      </div>
    </li>
  )
}

function NavigationButton({
  isDisabled,
  onClick,
  btnName,
}: {
  isDisabled: boolean
  onClick: React.ComponentProps<'button'>['onClick']
  btnName: string
}) {
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={classNames(
        'relative ml-3 inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700',
        isDisabled ? 'bg-gray-100' : 'bg-white hover:bg-gray-50',
      )}
    >
      {btnName}
    </button>
  )
}

export default function MyPostsList({ reason }: MyPostsListProps) {
  const router = useRouter()
  const [myPosts, setMyPosts] = useState<RouterOutputs['posts']['getMyPosts']['items']>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState<RouterOutputs['posts']['getMyPosts']['hasMore']>()
  const [previousCursor, setPreviousCursor] =
    useState<RouterInputs['posts']['getMyPosts']['cursor']>()

  const myPostsListQuery = api.posts.getMyPosts.useInfiniteQuery(
    { reason, limit: pageSize },
    {
      onSuccess: (data) => {
        const result = data.pages[page]
        setMyPosts(result?.items ?? [])
        setHasMore(result?.hasMore)
        setPreviousCursor(previousCursor)
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      getPreviousPageParam: () => previousCursor,
    },
  )

  const [countPost, setCountPosts] = useState<number>()

  const countMyPostsQuery = api.posts.countMyPosts.useQuery(
    { reason },
    {
      onSuccess: (data) => {
        setCountPosts(data)
      },
    },
  )

  const previousPageButtonIsDisabled = page === 0
  const nextPageButtonIsDisabled = !hasMore

  const fetchNextPage = async () => {
    setPage(page + 1)
    await myPostsListQuery.fetchNextPage()
  }

  const fetchPreviousPage = async () => {
    setPage(page - 1)
    await myPostsListQuery.fetchPreviousPage()
  }

  return (
    <Window>
      {myPostsListQuery.isLoading &&
        Array.from(Array(5).keys()).map((index) => <MyPostSkeleton key={index} />)}
      {!myPostsListQuery.isLoading && myPosts.length === 0 && (
        <div className='flex h-110 flex-col items-center justify-center text-center font-medium text-gray-700 lg:h-130'>
          <Image
            src='/assets/illustrations/basket.png'
            alt=''
            width={200}
            height={200}
            priority={false}
          />
          Постов нет
        </div>
      )}
      {!myPostsListQuery.isLoading && myPosts.length > 0 && (
        <>
          <div className='grid grid-cols-1 divide-y rounded border'>
            {myPosts.map((myPost, index) => (
              <Link href={myPost.slug} key={index}>
                <div className='rounded hover:bg-gray-50'>
                  <li className='mx-3 flex justify-between gap-x-6 py-1.5'>
                    <div className='min-w-0'>
                      <div className='flex flex-row items-center space-x-2'>
                        <p className='text-sm font-semibold leading-6 text-gray-900'>
                          {myPost.name}
                        </p>
                        <PostStatusBadge status={myPost.status} />
                      </div>
                      <p className='mt-1 max-w-xl truncate text-xs leading-5 text-gray-500'>
                        {myPost.description}
                      </p>
                    </div>
                    <div className='hidden sm:flex sm:flex-row sm:items-center sm:gap-x-4'>
                      <div className='flex flex-col items-end'>
                        <p className='text-sm leading-6 text-gray-900'>{Campus[myPost.campus]}</p>
                        <p className='mt-1 text-xs leading-5 text-gray-500'>
                          <span className='whitespace-nowrap'>
                            Дата создания: {formatDate(myPost.created)},
                          </span>{' '}
                          <span className='whitespace-nowrap'>
                            истекает: {formatDate(myPost.expires)}
                          </span>
                        </p>
                      </div>
                      <ChevronRightIcon className='h-5 w-5 text-gray-500' />
                    </div>
                  </li>
                </div>
              </Link>
            ))}
          </div>
          <nav
            className='flex items-center justify-between border-t border-gray-200 bg-white px-4 pt-5 sm:px-6'
            aria-label='Pagination'
          >
            <div className='hidden sm:block'>
              <p className='whitespace-nowrap text-sm text-gray-700'>
                <span className='font-bold'>
                  {page * pageSize + 1}–{page * pageSize + myPosts.length}
                </span>
                {countMyPostsQuery.isSuccess && (
                  <span className='font-medium'> из {countPost}</span>
                )}
              </p>
            </div>
            <div className='flex flex-1 justify-between sm:justify-end'>
              <NavigationButton
                isDisabled={previousPageButtonIsDisabled}
                onClick={() => void fetchPreviousPage()}
                btnName='Предыдущая'
              />
              <NavigationButton
                isDisabled={nextPageButtonIsDisabled}
                onClick={() => void fetchNextPage()}
                btnName='Следующая'
              />
            </div>
          </nav>
        </>
      )}
    </Window>
  )
}
