import {Box, BoxProps, IconButton, Link, SvgIcon, Tooltip} from '@mui/material'
import { FC, useContext, useMemo } from 'react'

import { DeleteModal } from 'app/components/DeleteModal'
import { TransferModal } from 'app/components/TransferModal'
import { Context } from 'app/context'
import { useModal, useClipboard, useFullShortPath, useTrotto } from 'app/hooks'
import { Copy, Eye } from 'app/icons'
import { media } from 'app/styles/theme'
import { Link as ILink } from 'app/types'

import { EditableDestination } from './EditableDestination'
import { InfoBox } from './InfoBox'
import { LinkActions } from './LinkActions'
import {VisibilityOffOutlined} from "@mui/icons-material";

const formatLastVisited = (dateString?: string): string | null => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }
    
    // For longer periods, show the date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  } catch {
    return null
  }
}

interface Props {
  link: ILink
  sx?: BoxProps['sx']
}

export const LinkItem: FC<Props> = ({ link, sx }) => {
  const { user } = useContext(Context)
  const { id, destination_url, owner, visits_count, shortpath, unlisted, visits_count_last_updated } = link
  const fullShortPath = useFullShortPath(link)
  const { baseUrl, isExtensionInstalled } = useTrotto()
  
  const lastVisitedText = useMemo(() => formatLastVisited(visits_count_last_updated), [visits_count_last_updated])

  const [transferModal, openTransferModal, closeTransferModal] = useModal()
  const [deleteModal, openDeleteModal, closeDeleteModal] = useModal()

  const navigationPath = useMemo(() => `${baseUrl}/${shortpath}`, [shortpath, baseUrl])

  // NOTE: still copy fullShortpath to avoid 'http://' before 'go'
  const handleCopy = useClipboard(isExtensionInstalled ? fullShortPath : navigationPath)

  const canEdit = useMemo(() => user && (user.admin || link.owner === user.email), [user, link])

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderBottom: '1px solid #f0f0f0',
          px: 1,
          py: 2.5,

          [media.TABLET]: {
            px: 3,
            py: 3.25,
            gap: 2,
          },

          [media.DESKTOP]: {
            py: 3.75,
          },
          ...sx,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content auto auto 1fr minmax(68px, max-content) max-content auto',
            alignItems: 'center',
          }}
        >
          <InfoBox
            sx={{
              fontWeight: 700,
              [media.TABLET]: {
                mr: 2,
                px: 2,
                height: 32,
              },
            }}
            bold
          >
            <Link href={navigationPath} target='_blank' rel='noreferrer'>
              {fullShortPath}
            </Link>
          </InfoBox>
          <IconButton
            onClick={handleCopy}
            sx={{
              opacity: 0.25,
              '&:focus': {
                opacity: 1,
              },
            }}
          >
            <Copy />
          </IconButton>
          {!unlisted ? <div /> : (
            <Box sx={{ml: 2, display: 'flex'}}>
              <Tooltip
                title={<Box fontSize='12px'>This unlisted go link can be used by any team member who knows the keyword, but only the owner and administrators can see it in the Trotto directory</Box>}
                arrow
                placement="right-start"
              >
                <Box sx={{cursor: 'help', display: 'flex', alignItems: 'center'}}>
                  <VisibilityOffOutlined />
                </Box>
              </Tooltip>
            </Box>
          )}
          <div />
          <InfoBox sx={{ ml: 1 }}>{owner}</InfoBox>
          <InfoBox>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                [media.TABLET]: {
                  alignItems: 'flex-end',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  [media.TABLET]: {
                    display: 'inline',
                  },
                }}
              >
                {visits_count}{' '}
                <Box
                  sx={{
                    display: 'none',
                    [media.TABLET]: {
                      display: 'inline',
                    },
                  }}
                >
                  {' '}
                  visits
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    ml: 1,
                    [media.TABLET]: {
                      display: 'none',
                    },
                  }}
                >
                  <Eye />
                </Box>
              </Box>
              {lastVisitedText && (
                <Box
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    [media.TABLET]: {
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  {lastVisitedText}
                </Box>
              )}
            </Box>
          </InfoBox>
          <LinkActions
            disabled={!canEdit}
            onTransfer={openTransferModal}
            onDelete={openDeleteModal}
          />
        </Box>
        <EditableDestination id={id} destinationUrl={destination_url} disabled={!canEdit} />
      </Box>
      {transferModal && (
        <TransferModal open={transferModal} onClose={closeTransferModal} link={link} />
      )}
      <DeleteModal open={deleteModal} onClose={closeDeleteModal} link={link} />
    </>
  )
}

export const LinkItemDummy: FC = () => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderBottom: '1px solid #f0f0f0',
          px: 1,
          py: 2.5,

          [media.TABLET]: {
            px: 3,
            py: 3.25,
            gap: 2,
          },

          [media.DESKTOP]: {
            py: 3.75,
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content auto auto 1fr minmax(68px, max-content) max-content auto',
            alignItems: 'center',
          }}
        >
          <InfoBox
            sx={{
              [media.TABLET]: {
                mr: 2,
                px: 2,
                height: 32,
              },
            }}
            bold
          />
          <div />
          <div />
          <div />
          <InfoBox sx={{ ml: 1 }} />
          <InfoBox />
          <SvgIcon />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto max-content',
            alignItems: 'center',
          }}
        >
          <InfoBox />
          <SvgIcon />
        </Box>
      </Box>
    </>
  )
}
