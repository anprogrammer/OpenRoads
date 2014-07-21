#ifdef CLASSIC
#define ARG_NAME "classic"
#endif

#ifdef XMAS
#define ARG_NAME "xmas"
#endif

#ifndef ARG_NAME
#define ARG_NAME "unset"
#endif

#include <Windows.h>
int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
	::SetCurrentDirectory(L"Node");
	::system("node.exe NodeMain.js " ARG_NAME);
}