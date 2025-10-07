import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ReactNode } from 'react';

const drawerWidth = 400; // from mui drawer component documentation for the specific style

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

interface Props {
  anchor: string;
  drawer_left_is_open: boolean;
  setDrawerLeftIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  drawer_right_is_open: boolean;
  setDrawerRightIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: ReactNode; 
}

const FixedDrawer: React.FC<Props> = ({ anchor, drawer_left_is_open, setDrawerLeftIsOpen, drawer_right_is_open, setDrawerRightIsOpen, children }) => {
  const drawerLeftOpen = () => {
    setDrawerLeftIsOpen(true);
    setDrawerRightIsOpen(false);
  };

  const drawerLeftClose = () => {
    setDrawerLeftIsOpen(false);
  };

  const drawerRightOpen = () => {
    setDrawerRightIsOpen(true);
    setDrawerLeftIsOpen(false);
  };

  const drawerRightClose = () => {
    setDrawerRightIsOpen(false);
  };

  return (
    <Drawer anchor={(anchor == "left") ? "left" : "right"} variant="permanent" open={(anchor == "left") ? drawer_left_is_open : drawer_right_is_open} sx = {{"& .MuiDrawer-paper": { borderWidth: 0 } }}>
      <DrawerHeader style={{ ...((anchor == "left") ? {} : {justifyContent: 'flex-start'}), backgroundColor: "#25292e"}}>
        {(((anchor == "left") && (drawer_left_is_open)) || ((anchor == "right") && (drawer_right_is_open))) ? (
          <IconButton sx={(anchor == "left") ? {pr:1.5} : {pl:1.5}} onClick={(anchor == "left") ? drawerLeftClose : drawerRightClose}>
            {(anchor == "left") ? (<ChevronLeftIcon style={{color: "#ffffff"}}/>) : (<ChevronRightIcon style={{color: "#ffffff"}}/>)}
          </IconButton>
        ) : (
          <IconButton  sx={(anchor == "left") ? {pr:1.5} : {pl:1.5}} color="inherit" onClick={(anchor == "left") ? drawerLeftOpen : drawerRightOpen}>
            <MenuIcon style={{color: "#ffffff"}}/>
          </IconButton>
        )}
      </DrawerHeader>
      {children}
    </Drawer>
  );
}

export default FixedDrawer;
